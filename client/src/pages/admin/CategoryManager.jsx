import GenericManager from '../../components/admin/GenericManager';
import adminService from '../../services/adminService';

const CategoryManager = () => {
  return (
    <GenericManager 
      title="Category"
      getFn={adminService.getCategories}
      createFn={adminService.createCategory}
      updateFn={adminService.updateCategory}
      deleteFn={adminService.deleteCategory}
      fields={[
        { name: 'name', label: 'Category Name', required: true, placeholder: 'e.g., Mughal Empire, British India, Ancient Coins' },
        { name: 'image', label: 'Image URL (Optional)', required: false, placeholder: 'e.g., https://... or /images/categories/mughal.jpg' },
        { name: 'description', label: 'Description (Optional)', type: 'textarea', placeholder: 'Provide numismatic classification details, era coverage, or dynasty notes...' }
      ]}
    />
  );
};

export default CategoryManager;
