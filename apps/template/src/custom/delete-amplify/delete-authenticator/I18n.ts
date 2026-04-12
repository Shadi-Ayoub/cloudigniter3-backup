import { I18n } from "aws-amplify/utils";
import { translations } from "@aws-amplify/ui-react";
I18n.putVocabularies(translations);
I18n.setLanguage("en");

I18n.putVocabularies({
  fr: {
    "Sign In": "Se connecter",
    "Sign Up": "S'inscrire",
  },
  es: {
    "Sign In": "Registrarse",
    "Sign Up": "Regístrate",
  },
});

export default I18n;
