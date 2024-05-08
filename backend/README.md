
# Hospital Booking

admin:
    id
    name
    email
    phone
    password_hash
    created_at
    updated_at

doctor:
    id
    name
    email
    phone
    signup_request_token
    password_recover_token
    password_hash
    certificate_file
    identity_file
    created_at
    updated_at
    registration_status

department:
    id
    name
    type
    description
    leader_id
    created_at
    updated_at
    profile_photo

appointment:
    id
    description
    department_id
    doctor_id
    patient_at
    created_at
    updated_at
    appointed_at

patient:
   id
   name
   email
   phone
   password_hash
   created_at
   updated_at
