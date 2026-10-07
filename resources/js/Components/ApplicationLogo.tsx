import { SVGAttributes } from 'react';

export default function ApplicationLogo(props: SVGAttributes<SVGElement>) {
    return (
        <svg
            {...props}
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <circle cx="50" cy="50" r="45" fill="#0067ab" />
            
            {/* Leaf/Medical cross combined */}
            <path
                d="M50 20C50 20 65 20 65 35C65 50 50 50 50 50C50 50 35 50 35 65C35 80 50 80 50 80"
                stroke="white"
                strokeWidth="8"
                strokeLinecap="round"
            />
            <path
                d="M50 20C50 20 35 20 35 35C35 50 50 50 50 50C50 50 65 50 65 65C65 80 50 80 50 80"
                stroke="#e6f0f7"
                strokeWidth="8"
                strokeLinecap="round"
                opacity="0.7"
            />
            {/* Medical Cross Accent */}
            <rect x="44" y="30" width="12" height="40" rx="2" fill="white" />
            <rect x="30" y="44" width="40" height="12" rx="2" fill="white" />
        </svg>
    );
}
