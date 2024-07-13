
import React from 'react';
import './index.css';
import { Link } from "react-router-dom";
import clickSong from '../../assets/click-151673.mp3';

interface ButtonProps {
    text?: string;
    onClick?: () => void;
    className?: string;
    href?: string;
    leftIcon?: JSX.Element;
    rightIcon?: JSX.Element;
}
const CustomButton: React.FC<ButtonProps> = ({
    text,
    onClick,
    className,
    href,
    leftIcon,
    rightIcon
}) => {

    const startClickSound = () => {
        const clickAudio = new Audio(clickSong);
        clickAudio.play();
    }

    const handleClick = () => {
        onClick?.();
        startClickSound();
    }

    const renderLink = () => {
        let gridColumns = text ? '1fr 1fr 1fr' : '1fr';
        return (
            <Link
                className={className ?? 'flex-center button'}
                onClick={handleClick}
                style={{
                    display: 'grid',
                    gridTemplateColumns: gridColumns,

                }}
                to={href ?? "/"}
            >
                <div>{leftIcon}</div>
                {text && <span style={{ margin: '0px 24px' }}>{text}</span>}
                <div>{rightIcon}</div>
            </Link>
        );
    }
    const renderButton = () => {
        const buttonClassName = `button ${className ?? ''}`;
        
        return (
            <div
                className={buttonClassName}>
                {leftIcon}
                {text &&
                    <button
                        onClick={()=>handleClick}
                        className={className ?? 'button'}>
                        <span>{text}</span>
                    </button>
                }
                {rightIcon}
            </div>
        );
    }

    return href ? renderLink() : renderButton();
};
export default CustomButton;