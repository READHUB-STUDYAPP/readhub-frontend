import React from 'react';
import { ReadHubImages } from '../assets/asset'; // Assuming default user icon is here

const ProfilePhotoSelector = ({ image }) => {
    return (
        <div className="w-20 h-20 flex items-center justify-center bg-purple-100 rounded-full relative">
            {image ? (
                <img src={image} alt="profile" className="w-full h-full rounded-full object-cover" />
            ) : (
                <img src={ReadHubImages.profileIcon} alt="default-profile" className="w-12 h-12" />
            )}
        </div>
    );
};

export default ProfilePhotoSelector;