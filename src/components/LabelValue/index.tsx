import React from 'react';
import './index.css';

interface LabelValueProps {
    text?: string;
    onClick?: () => void;
    className?: string;
    children?: any;
    value: string;
}
const LabelValue: React.FC<LabelValueProps> = ({
    text,
    onClick,
    className,
    children,
    value
}) => {

    const handleClick = () => {
        onClick?.();
    }



    return (
        <div className="label-container">
            <strong>
                {children}
                {value}
            </strong>
            <label>
                {text}
            </label>
        </div>

    )
};
export default LabelValue;