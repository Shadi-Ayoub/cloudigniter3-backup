// https://ui.docs.amplify.aws/react/connected-components/authenticator/customization#sign-up-fields

const formFields = {
  signUp: {
    email: {
      label: 'Email',
      placeholder: 'Enter your Email',
      isRequired: true,
      order: 1,
    },
    password: {
      label: 'Password',
      placeholder: 'Enter your Password',
      isRequired: true,
      order: 2,
    },
    confirm_password: {
      label: 'Confirm Password',
      placeholder: 'Please Confirm your Password',
      isRequired: true,
      order: 3,
    },
    preferred_username: {
      label: 'Preferred Username',
      placeholder: 'Choose a username',
      isRequired: false,
      order: 4,
    },
    given_name: {
      label: 'First Name',
      placeholder: 'Enter your first name',
      isRequired: false,
      order: 5,
    },
    middle_name: {
      label: 'Middle Name',
      placeholder: 'Enter your middle name',
      isRequired: false,
      order: 6,
    },
    family_name: {
      label: 'Last Name',
      placeholder: 'Enter your last name',
      isRequired: false,
      order: 7,
    },
    birthdate: {
      label: 'Birthdate',
      placeholder: 'Enter your birthdate',
      isRequired: false,
      order: 8,
    },
  },
};

export default formFields;
