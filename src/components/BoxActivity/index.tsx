import React from 'react';
import './index.css';
import { Link } from 'react-router-dom';

interface BoxActivityProps {
    text?: string;
    onClick?: () => void;
    containerClassName?: string;
    imageClassName?: string;
    src?: string;
    alt?: string;
    navigateTo: string;
}
const BoxActivity: React.FC<BoxActivityProps> = ({
    text,
    onClick,
    containerClassName,
    imageClassName,
    src,
    alt,
    navigateTo
}) => {

    const handleClick = () => {
        onClick?.();
    }



    return (
        <Link
            to={navigateTo}
            className={`box-container ${containerClassName}`}
            onClick={handleClick}>
            <img
                src={src}
                className={`box-image ${imageClassName}`}
                alt={alt ?? ""} />
            <label>
                {text}
            </label>
        </Link>

    )
};
export default BoxActivity;