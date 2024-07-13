import React from 'react';
import './index.css';

interface BoxRowProps {
    children?: any;
    justifyContent?: string;
    width?: string;
    gap?:string;
    bgColor?:string;
    radius?: string;
}
const BoxRow: React.FC<BoxRowProps> = ({
    children,
    justifyContent,
    width,
    gap,
    bgColor,
    radius,
}) => {

    return (
        <div
            className="flex-row"
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