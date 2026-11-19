import React from 'react';
import './index.css';
import { Link } from "react-router-dom";
import clickSong from '../../assets/click-151673.mp3';
import { playSound } from '../../utils/sounds';

interface ButtonProps {
    text?: string;
    onClick?: () => void;
    className?: string;
    href?: string;
    leftIcon?: React.JSX.Element;
    rightIcon?: React.JSX.Element;
    ariaLabel?: string;
    ariaPressed?: boolean;
}
const CustomButton: React.FC<ButtonProps> = ({
    text,
    onClick,
    className,
    href,
    leftIcon,
    rightIcon,
    ariaLabel,
    ariaPressed
}) => {

    const handleClick = () => {
        onClick?.();
        playSound(clickSong);
    }

    const hasAccessibleName = Boolean(text || ariaLabel);

    const decorate = (icon?: React.JSX.Element) =>
        icon && hasAccessibleName
            ? React.cloneElement(icon, { 'aria-hidden': 'true' })
            : icon;

    const left = decorate(leftIcon);
    const right = decorate(rightIcon);

    const renderLink = () => {
        const gridColumns = text ? '1fr 1fr 1fr' : '1fr';
        return (
            <Link
                className={className ?? 'flex-center button'}
                onClick={handleClick}
                aria-label={ariaLabel}
                style={{
                    display: 'grid',
                    gridTemplateColumns: gridColumns,
                }}
                to={href ?? "/"}
            >
                <div>{left}</div>
                {text && <span style={{ margin: '0px 24px' }}>{text}</span>}
                <div>{right}</div>
            </Link>
        );
    }
    const renderButton = () => {
        const buttonClassName = `button ${className ?? ''}`;

        return (
            <button
                type="button"
                className={buttonClassName}
                onClick={handleClick}
                aria-label={ariaLabel}
                aria-pressed={ariaPressed}>
                {left}
                {text && <span>{text}</span>}
                {right}
            </button>
        );
    }

    return href ? renderLink() : renderButton();
};
export default CustomButton;