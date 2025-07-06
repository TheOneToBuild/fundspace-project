// src/components/ImageUploader.jsx
import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { UploadCloud, CheckCircle } from 'lucide-react';

export default function ImageUploader({ bucket, currentImageUrl, onUploadSuccess }) {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleImageUpload = async (event) => {
        try {
            setUploading(true);
            setError('');
            setSuccess('');

            if (!event.target.files || event.target.files.length === 0) {
                throw new Error('You must select an image to upload.');
            }

            const file = event.target.files[0];
            if (file.size > 2 * 1024 * 1024) { // 2MB limit
                throw new Error('Image file size must be less than 2MB.');
            }
            
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage.from(bucket).upload(filePath, file);
            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(filePath);
            
            onUploadSuccess(publicUrl);
            setSuccess('Image updated successfully! Save changes to apply.');

        } catch (error) {
            setError(error.message);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div>
            <div className="flex items-center space-x-4">
                <div className="w-24 h-24 bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden border">
                    {currentImageUrl ? (
                        <img src={currentImageUrl} alt="Current" className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-xs text-slate-500">No Image</span>
                    )}
                </div>
                <div>
                    <label htmlFor={`upload-${bucket}`} className="cursor-pointer inline-flex items-center px-4 py-2 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50">
                        <UploadCloud size={16} className="mr-2" />
                        {uploading ? 'Uploading...' : 'Upload Image'}
                    </label>
                    <input id={`upload-${bucket}`} type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
                    <p className="text-xs text-slate-500 mt-2">PNG, JPG, up to 2MB.</p>
                </div>
            </div>
            {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
            {success && <p className="text-green-600 text-sm mt-2 flex items-center"><CheckCircle size={14} className="mr-1.5" />{success}</p>}
        </div>
    );
}