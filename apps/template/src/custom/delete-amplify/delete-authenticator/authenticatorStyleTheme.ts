import {
    Theme,
    useTheme,
} from '@aws-amplify/ui-react';

interface Tokens {
    colors: {
        overlay: { [key: string]: string };
        neutral: { [key: string]: string };
        purple: { [key: string]: string };
    };
    space: {
        medium: string;
        xl: string;
    };
}

function AuthenticatorStyle() {
    const { tokens } = useTheme();
    const theme: Theme = {
        name: 'Auth Example Theme',
        tokens: {
            components: {
                authenticator: {
                    router: {
                        boxShadow: `0 0 16px ${tokens.colors.overlay['10']}`,
                        borderWidth: '0',
                    },
                    form: {
                        padding: `${tokens.space.medium} ${tokens.space.xl} ${tokens.space.medium}`,
                    },
                },
                button: {
                    primary: {
                        backgroundColor: tokens.colors.neutral['100'],
                    },
                    link: {
                        color: tokens.colors.purple['80'],
                    },
                },
                fieldcontrol: {
                    _focus: {
                        boxShadow: `0 0 0 2px ${tokens.colors.purple['60']}`,
                    },
                },
                tabs: {
                    item: {
                        color: tokens.colors.neutral['80'],
                        _active: {
                            borderColor: tokens.colors.neutral['100'],
                            color: tokens.colors.purple['100'],
                        },
                    },
                },
            },
        },
    };

    return theme;
}

export default AuthenticatorStyle;