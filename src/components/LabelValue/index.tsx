import React from 'react';
import './index.css';

interface LabelValueProps {
    text?: string;
    onClick?: () => void;
    className?: string;
    children?: React.ReactNode;
    value: string;
    type?: 'hits' | 'errors'
}
const LabelValue: React.FC<LabelValueProps> = ({
    text,
    onClick,
    className,
    children,
    value,
    type
}) => {

    const handleClick = () => {
        onClick?.();
    }
    const classNameComplete = `label-container text-xs sm:text-sm px-1.5 sm:px-3 py-1 ${type ?? 'default'} ${className ?? ''}`;
    return (
        <div className={classNameComplete} onClick={handleClick}>
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