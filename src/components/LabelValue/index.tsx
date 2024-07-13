import React from 'react';
import './index.css';

interface LabelValueProps {
    text?: string;
    onClick?: () => void;
    className?: string;
    children?: any;
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
    const classNameComplete = `label-container ${type ?? 'default'} ${className ?? ''}`;
    return (
        <div className={classNameComplete}>
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