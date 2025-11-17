# How to Create a Superuser Account

## Option 1: Using Render Shell (Recommended)

1. Go to your Render dashboard: https://dashboard.render.com
2. Click on your `ebloodbank-backend` service
3. Click on **Shell** tab (or use SSH)
4. Run these commands:
   ```bash
   cd backend
   python manage.py createsuperuser
   ```
5. Follow the prompts:
   - Username: (enter a username)
   - Email: (enter your email)
   - Phone: (enter your phone number)
   - User type: (choose: donor, bloodbank, or admin)
   - Password: (enter a password - it won't show as you type)
   - Password (again): (confirm password)

## Option 2: Using Signup on Frontend

1. Go to your frontend: https://e-blood-bank-pi.vercel.app
2. Click on **Signup**
3. Fill in the form:
   - Username
   - Email
   - Phone
   - Password
   - User type (Donor or Blood Bank)
4. Complete the signup process
5. Then try logging in with those credentials

## Option 3: Create User via Django Admin (After Creating Superuser)

1. First create a superuser (Option 1)
2. Log in to admin: https://e-bloodbank.onrender.com/admin/
3. Go to **Accounts** → **Users**
4. Click **Add User**
5. Fill in the details and save

## Notes

- For **User type**, choose:
  - `donor` - For regular users/donors
  - `bloodbank` - For blood bank accounts
  - `admin` - For admin accounts (only via createsuperuser)

- The phone number must be unique
- Email is optional but recommended

