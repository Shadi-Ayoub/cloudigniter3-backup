/**
 * [Configuration]
 *
 * [[Initial State]]
 * By default, unauthenticated users are redirected to the Sign In flow. However, You can
 * explicitly redirect to Sign Up or Forgot Password. initialState: 'signIn' | 'signUp' |
 * 'forgotPassword'.
 *
 * [[Login Mechanisms]]
 * The Authenticator automatically infers loginMechanisms from the current Amplify configuration,
 * but can be explicitly defined. Without the zero configuration, the Authenticator by default
 * creates new users in the Amazon Cognito UserPool based on a unique username. You can provide an
 * alternative to username such as email or phone_number.
 *
 * An Email, or phone_number value is required for Cognito User Pools. Login with Username is not
 * currently supported using Amplify Gen2 backends.
 *
 * [[Zero Configuration of signUpAttributes]]
 * The Authenticator automatically infers signUpAttributes from amplify pull, but can
 * be explicitly defined as seen below. The Authenticator automatically renders most Cognito
 * User Pools attributes, with the exception of address, gender, locale, picture, updated_at,
 * and zoneinfo. Because these are often app-specific, they can be customized via Sign Up fields.
 * All signUpAttributes: ['address', 'birthdate', 'email', 'family_name', 'gender', 'given_name',
 * 'locale', 'middle_name', 'name', 'nickname', 'phone_number', 'picture', 'preferred_username',
 * 'profile', 'updated_at', 'website', 'zoneinfo',].
 *
 * [[Social Providers]]
 * The Authenticator automatically infers socialProviders from amplify pull (Zero configuration),
 * but can be explicitly defined. For your configured social providers, you can also provide amazon,
 * facebook, apple, or google. socialProviders={['amazon', 'apple', 'facebook', 'google']}. See the
 * video: https://www.youtube.com/watch?v=8KwZNn56F78&feature=youtu.be
 *
 * [[Variation]]
 * By default, the Authenticator will render as a centered card within the container. However,
 * you can specify the 'modal' variation, which overlays the entire screen with the Authenticator.
 *
 * [[Hide Sign Up]]
 * The Authenticator has an option to hide the sign up page including the Create Account tab.
 *
 */
const config = {
  initialState: "signIn", // Default
  loginMechanisms: ["email"], // Default
  signUpAttributes: [],
  socialProviders: [],
  // variation: "modal",
  hideSignUp: false,
};

export default config;
