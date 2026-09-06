const MAX_PROFILE_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_PROFILE_IMAGE_DIMENSION = 1600;

const prepareProfileImage = (file) => new Promise((resolve, reject) => {
  if (!file.type.startsWith('image/')) {
    reject(new Error('Please select an image file.'));
    return;
  }

  if (file.size <= MAX_PROFILE_IMAGE_BYTES && file.type !== 'image/gif') {
    resolve(file);
    return;
  }

  const image = new Image();
  const objectUrl = URL.createObjectURL(file);

  image.onload = () => {
    URL.revokeObjectURL(objectUrl);
    const scale = Math.min(1, MAX_PROFILE_IMAGE_DIMENSION / Math.max(image.width, image.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    const context = canvas.getContext('2d');
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Unable to prepare the selected image.'));
        return;
      }

      resolve(new File([blob], 'profile-photo.jpg', {
        type: 'image/jpeg',
        lastModified: Date.now()
      }));
    }, 'image/jpeg', 0.82);
  };

  image.onerror = () => {
    URL.revokeObjectURL(objectUrl);
    reject(new Error('Unable to read the selected image.'));
  };
  image.src = objectUrl;
});

export default prepareProfileImage;
