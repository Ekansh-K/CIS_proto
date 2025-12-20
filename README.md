
## Setup

The usual process for Next.js based apps/websites:

1. Install node modules:

   `$ pnpm i`


2. Run development environment:

   `$ pnpm dev`

## Supabase & Admin Panel Setup

This project uses **Supabase** for Events Management and Registrations.

### 1. Environment Variables
Create a `.env.local` file in the root directory (do not commit this file):

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. Database Schema
Run the SQL queries provided in `implementation_plan.md` in your Supabase SQL Editor to create the `events` and `registrations` tables and set up Row Level Security (RLS).

### 3. Authentication
- **Admin Access**: Enable Email/Password auth in Supabase. Create an admin user manually in the Supabase Dashboard > Authentication > Users.
- **Student Registration**: Enable **Azure (Microsoft)** provider in Supabase Authentication.
    - **Redirect URL**: Add `http://localhost:3000/**` and your production URL `https://your-domain.com/**` to the Redirect URLs in Supabase.

### 4. Storage
Create a public bucket named `event-posters` in Supabase Storage.

## Admin Panel
Access the admin panel at `/admin`.
- Login with the admin credentials created in step 3.
- Manage events (Create, Edit, Delete).
- View registrations for each event.

## Stack

- [Lenis](https://github.com/darkroomengineering/lenis) - Smooth scroll library
- [Tempus](https://github.com/darkroomengineering/tempus) - Animation timing control
- [Hamo](https://github.com/darkroomengineering/hamo) - React hooks and utilities




## Folder Structure


- **/assets:** General Images/Videos and SVGs
- **/pages/admin:** Admin Panel Pages
- **/components:** Reusable components with their respective Sass files
- **/config:** General settings 
- **/hooks:** Reusable Custom Hooks
- **/layouts:** High level layout components
- **/lib:** Supabase Client and State Store
- **/styles:** Global styles and Sass partials

## Acknowledgements

Special thanks to Darkroom Engineering for the [Lenis](https://github.com/darkroomengineering/lenis) smooth scroll library and their  web animations, which have been used in this site
