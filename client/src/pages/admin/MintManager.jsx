import GenericManager from '../../components/admin/GenericManager';
import adminService from '../../services/adminService';

const MintManager = () => {
  return (
    <GenericManager 
      title="Mint"
      getFn={adminService.getMints}
      createFn={adminService.createMint}
      updateFn={adminService.updateMint}
      deleteFn={adminService.deleteMint}
      fields={[
        { name: 'name', label: 'Mint Name', required: true, placeholder: 'e.g., Calcutta Mint, Bombay Mint, Lahore Mint, Madras Mint' },
        { name: 'mintMark', label: 'Mint Mark / Symbol', required: false, placeholder: 'e.g., C, B, M, Diamond (♦), Star (★), Dot (•)' },
        { name: 'location', label: 'Location / City', required: false, placeholder: 'e.g., Kolkata, West Bengal or Mumbai, Maharashtra' },
        { name: 'country', label: 'Issuing Country', type: 'countrySelect', required: true, placeholder: '-- Select Country --' },
      ]}
    />
  );
};

export default MintManager;
