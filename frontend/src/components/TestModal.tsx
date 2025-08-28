import React from 'react';

interface TestModalProps {
  onClose: () => void;
}

const TestModal: React.FC<TestModalProps> = ({ onClose }) => {
  console.log('TestModal rendered');
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md">
        <h2 className="text-2xl font-bold mb-4">Test Modal</h2>
        <p className="mb-4">Toto je test modal pre debugging.</p>
        <button
          onClick={onClose}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg"
        >
          Zatvoriť
        </button>
      </div>
    </div>
  );
};

export default TestModal;
