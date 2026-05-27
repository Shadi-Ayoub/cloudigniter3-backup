import { type ReactElement, type ReactNode } from 'react';
interface NeonColorsProps {
    firstColor: string;
    secondColor: string;
}
interface NeonGradientCardProps {
    /**
     * @default <div />
     * @type ReactElement
     * @description
     * The component to be rendered as the card
     * */
    as?: ReactElement;
    /**
     * @default ""
     * @type string
     * @description
     * The className of the card
     */
    className?: string;
    /**
     * @default ""
     * @type ReactNode
     * @description
     * The children of the card
     * */
    children?: ReactNode;
    /**
     * @default 5
     * @type number
     * @description
     * The size of the border in pixels
     * */
    borderSize?: number;
    /**
     * @default 20
     * @type number
     * @description
     * The size of the radius in pixels
     * */
    borderRadius?: number;
    /**
     * @default "{ firstColor: '#ff00aa', secondColor: '#00FFF1' }"
     * @type string
     * @description
     * The colors of the neon gradient
     * */
    neonColors?: NeonColorsProps;
    [key: string]: any;
}
export declare const NeonGradientCard: React.FC<NeonGradientCardProps>;
export {};
//# sourceMappingURL=neon-gradient-card.d.ts.map