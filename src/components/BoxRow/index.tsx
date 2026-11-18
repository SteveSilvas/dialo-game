import React from 'react';

interface BoxRowProps {
    children?: React.ReactNode;
    justifyContent?: string;
    width?: string;
    gap?: string;
    bgColor?: string;
    radius?: string;
    className?: string;
}
const BoxRow: React.FC<BoxRowProps> = ({
    children,
    justifyContent,
    width,
    gap,
    bgColor,
    radius,
    className,
}) => {

    return (
        <div
            className={`flex-row flex-wrap items-center ${className ?? ''}`}
            style={{
                justifyContent: justifyContent,
                width: width,
                gap: gap,
                backgroundColor: bgColor,
                borderRadius: radius
            }}>
            {children}
        </div>

    )
};
export default BoxRow;