from rest_framework import viewsets, permissions
from .models import Donor, Donation, Appointment
from .serializers import DonorSerializer, DonationSerializer, AppointmentSerializer


class DonorViewSet(viewsets.ModelViewSet):
    queryset = Donor.objects.all().order_by('-created_at')
    serializer_class = DonorSerializer
    # Remove 'user' from filterset_fields since we handle it manually
    filterset_fields = ['blood_group', 'city', 'state', 'is_eligible']
    # Support search by exact numeric id and fuzzy text fields
    search_fields = ['=id', 'full_name', 'city', 'state', 'blood_group', 'email', 'phone']
    ordering_fields = ['created_at', 'full_name']

    def get_queryset(self):
        qs = super().get_queryset()
        # Handle user filter manually before filterset processing
        user_id = self.request.query_params.get('user')
        if user_id is not None:
            try:
                uid = int(user_id)
                qs = qs.filter(user_id=uid)
            except (ValueError, TypeError):
                # Return empty queryset for invalid user id instead of 400
                return qs.none()
        return qs


class DonationViewSet(viewsets.ModelViewSet):
    queryset = Donation.objects.all().order_by('-donation_date')
    serializer_class = DonationSerializer
    filterset_fields = ['donor', 'bloodbank', 'donation_date']
    search_fields = ['donor__full_name', 'bloodbank__name']
    ordering_fields = ['donation_date', 'units_donated']
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        
        # Blood bank users see only donations at their blood bank
        if hasattr(user, 'bloodbank'):
            return qs.filter(bloodbank=user.bloodbank)
        
        # Donor users see ONLY their own donations (donations where they are the donor)
        if hasattr(user, 'donor'):
            return qs.filter(donor=user.donor)
        
        # Admin users can see all donations
        if user.is_staff or user.is_superuser:
            return qs
        
        # For any other user type, return empty queryset (no donations visible)
        return qs.none()

    def create(self, request, *args, **kwargs):
        user = request.user
        # Only blood bank users can create donation records
        if not hasattr(user, 'bloodbank'):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('Only blood bank users can add donations.')
        
        # Debug: Print incoming data to console
        print(f"\n=== DONATION CREATE REQUEST ===")
        print(f"Request data: {request.data}")
        print(f"Request data type: {type(request.data)}")
        
        # Validate serializer data - raise_exception will return proper 400 response with errors
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            print(f"\n=== SERIALIZER VALIDATION ERRORS ===")
            print(f"Errors: {serializer.errors}")
            print(f"Errors type: {type(serializer.errors)}")
            from rest_framework.exceptions import ValidationError
            raise ValidationError(serializer.errors)
        
        print(f"Validation passed! Validated data: {serializer.validated_data}")
        
        # Get donor, user_id, or email from validated data
        validated_data = serializer.validated_data.copy()
        donor = validated_data.pop('donor', None)
        user_id = validated_data.pop('user_id', None)
        email = validated_data.pop('email', None)
        blood_group = validated_data.pop('blood_group', None) or 'O+'  # Default to O+ if not provided
        
        print(f"After popping: donor={donor}, user_id={user_id}, email={email}, blood_group={blood_group}")
        print(f"Remaining validated_data: {validated_data}")
        
        # If email is provided, get user_id from email
        if email and not user_id:
            try:
                from accounts.models import User
                email_normalized = email.strip().lower()
                donor_user_by_email = User.objects.get(email__iexact=email_normalized)
                user_id = donor_user_by_email.id
                print(f"Found user by email: {donor_user_by_email.username} (ID: {user_id})")
            except User.DoesNotExist:
                print(f"User with email {email} does not exist")
                from rest_framework.exceptions import ValidationError
                raise ValidationError({'email': [f'User with email {email} not found. Please enter a valid email address.']})
            except Exception as e:
                print(f"Error getting user by email: {e}")
                from rest_framework.exceptions import ValidationError
                raise ValidationError({'email': [f'Error finding user by email: {str(e)}']})
        
        # Convert user_id to int if it's provided
        if user_id is not None:
            try:
                user_id = int(user_id)
                print(f"Converted user_id to int: {user_id}")
            except (ValueError, TypeError) as e:
                print(f"Error converting user_id: {e}")
                from rest_framework.exceptions import ValidationError
                raise ValidationError({'user_id': ['user_id must be a valid integer']})
        
        # If no donor provided but user_id is, try to get or create donor
        if not donor and user_id:
            print(f"Looking up user with ID: {user_id}")
            from accounts.models import User
            from django.db import transaction
            from datetime import date
            
            try:
                donor_user = User.objects.get(id=user_id)
                print(f"Found user: {donor_user.username} (ID: {donor_user.id})")
            except User.DoesNotExist as e:
                print(f"User with ID {user_id} does not exist: {e}")
                from rest_framework.exceptions import ValidationError
                from rest_framework.response import Response
                from rest_framework import status
                error_detail = {'user_id': [f'User with ID {user_id} does not exist. Please enter a valid user ID.']}
                print(f"Returning ValidationError: {error_detail}")
                # Raise ValidationError - DRF will handle it
                raise ValidationError(error_detail)
            except Exception as e:
                print(f"Unexpected error getting user: {e}")
                from rest_framework.exceptions import ValidationError
                raise ValidationError({'user_id': [f'Error getting user: {str(e)}']})
            
            # Check if donor profile exists using direct query (more reliable)
            try:
                donor = Donor.objects.get(user=donor_user)
                print(f"Found existing donor profile: {donor.id}")
            except Donor.DoesNotExist:
                print(f"Donor profile does not exist for User ID {user_id}, creating new one...")
                # Auto-create donor profile with minimal data
                from accounts.models import UserProfile
                try:
                    profile = donor_user.profile
                    print(f"Found user profile")
                except Exception as e:
                    print(f"No user profile found: {e}")
                    profile = None
                
                # Use profile data or defaults - ensure all required fields have values
                try:
                    # Get phone from user - ensure it's 10 digits or use default
                    user_phone = donor_user.phone or ''
                    # Normalize phone to 10 digits
                    phone_digits = ''.join(filter(str.isdigit, str(user_phone)))
                    if len(phone_digits) != 10:
                        # If phone is not exactly 10 digits, pad with zeros or use default
                        if len(phone_digits) > 0:
                            # Pad existing digits to 10
                            phone_digits = phone_digits.ljust(10, '0')[:10]
                        else:
                            # Use default if no phone
                            phone_digits = '0000000000'
                    
                    # Ensure email is valid
                    user_email = donor_user.email or f'user{user_id}@example.com'
                    if not user_email or '@' not in user_email:
                        user_email = f'user{user_id}@example.com'
                    
                    # Create donor profile with all required fields
                    donor_data = {
                        'user': donor_user,
                        'full_name': donor_user.get_full_name() or donor_user.username or f'User {user_id}',
                        'blood_group': blood_group,
                        'date_of_birth': profile.date_of_birth if profile and profile.date_of_birth else date(2000, 1, 1),
                        'gender': 'M',  # Default
                        'phone': phone_digits,
                        'email': user_email,
                        'address': profile.address if profile and profile.address else 'Not provided',
                        'city': profile.city if profile and profile.city else 'Not provided',
                        'state': profile.state if profile and profile.state else 'Not provided',
                        'pincode': profile.pincode if profile and profile.pincode else '000000',
                        'weight': 70.0,  # Default weight
                        'emergency_contact': phone_digits,
                        'medical_conditions': '',
                    }
                    
                    print(f"Creating donor profile with data: {donor_data}")
                    donor = Donor.objects.create(**donor_data)
                    print(f"Successfully created donor profile: {donor.id} for User ID {user_id}")
                except Exception as e:
                    print(f"Error creating donor profile: {e}")
                    import traceback
                    traceback.print_exc()
                    from rest_framework.exceptions import ValidationError
                    error_message = f'Failed to create donor profile for User ID {user_id}. '
                    if 'phone' in str(e).lower():
                        error_message += 'Please ensure the user has a valid 10-digit phone number. '
                    elif 'email' in str(e).lower():
                        error_message += 'Please ensure the user has a valid email address. '
                    else:
                        error_message += f'Error: {str(e)}. '
                    error_message += 'The donor profile will be created automatically with default values if the user has valid account data.'
                    raise ValidationError({'user_id': [error_message]})
            except Exception as e:
                print(f"Unexpected error checking for donor profile: {e}")
                import traceback
                traceback.print_exc()
                from rest_framework.exceptions import ValidationError
                raise ValidationError({'user_id': [f'Error checking donor profile for User ID {user_id}: {str(e)}']})
        
        if not donor:
            print("ERROR: No donor found or created")
            from rest_framework.exceptions import ValidationError
            raise ValidationError({'donor': ['Donor is required. Please provide either donor ID or user_id']})
        
        print(f"Using donor: {donor.id} (user: {donor.user.username})")
        print(f"Creating donation with: donor={donor.id}, bloodbank={user.bloodbank.id}, validated_data={validated_data}")
        
        # Create donation and update inventory in a single transaction
        from inventory.models import Inventory
        from django.db import transaction
        from rest_framework import status
        from rest_framework.response import Response
        from rest_framework.exceptions import ValidationError
        
        try:
            with transaction.atomic():
                # Create donation with all validated data
                try:
                    donation = Donation.objects.create(
                        donor=donor,
                        bloodbank=user.bloodbank,
                        **validated_data
                    )
                    print(f"Created donation: {donation.id}")
                except Exception as e:
                    print(f"Error creating donation: {e}")
                    import traceback
                    traceback.print_exc()
                    raise ValidationError({'donation': [f'Error creating donation: {str(e)}']})
                
                # Automatically update inventory when donation is created
                try:
                    # Get or create inventory for this blood group
                    inventory, created = Inventory.objects.get_or_create(
                        bloodbank=user.bloodbank,
                        blood_group=donation.donor.blood_group,
                        defaults={
                            'units_available': 0,
                            'min_stock_level': 5
                        }
                    )
                    print(f"Inventory {'created' if created else 'found'}: {inventory.id}, current units: {inventory.units_available}")
                    
                    # Add donated units to inventory
                    inventory.units_available += donation.units_donated
                    inventory.save()
                    print(f"Inventory updated: new units: {inventory.units_available}")
                except Exception as e:
                    print(f"Error updating inventory: {e}")
                    import traceback
                    traceback.print_exc()
                    raise ValidationError({'inventory': [f'Error updating inventory: {str(e)}']})
                
                # Update donor's last donation date
                try:
                    if donation.donor:
                        donation.donor.last_donation_date = donation.donation_date
                        donation.donor.save()
                        print(f"Updated donor last donation date: {donation.donor.last_donation_date}")
                except Exception as e:
                    print(f"Error updating donor: {e}")
                    import traceback
                    traceback.print_exc()
                    # Don't fail the whole request if this fails, just log it
                    pass
            
            print(f"Transaction completed successfully. Donation ID: {donation.id}")
            
            # Return serialized response
            serializer = self.get_serializer(donation)
            headers = self.get_success_headers(serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
            
        except ValidationError as e:
            print(f"ValidationError raised: {e}")
            print(f"ValidationError detail: {e.detail if hasattr(e, 'detail') else str(e)}")
            raise
        except Exception as e:
            print(f"Unexpected error in transaction: {e}")
            import traceback
            traceback.print_exc()
            raise ValidationError({'error': [f'Unexpected error: {str(e)}']})


class AppointmentViewSet(viewsets.ModelViewSet):
    queryset = Appointment.objects.all().order_by('-appointment_date')
    serializer_class = AppointmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        # Donors see their appointments; bloodbanks see appointments to their bank
        if hasattr(user, 'bloodbank'):
            return qs.filter(bloodbank=user.bloodbank)
        return qs.filter(user=user)

    def perform_create(self, serializer):
        user = self.request.user
        # Auto-assign user
        serializer.save(user=user)
        
        # Log the appointment creation
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"Appointment created: User {user.id} -> Blood Bank {serializer.validated_data.get('bloodbank').id} on {serializer.validated_data.get('appointment_date')}")
