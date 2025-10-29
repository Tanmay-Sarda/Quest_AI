"use client";

export default function DeleteStory({ storyTitle, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50">
      <div className="p-8 rounded-2xl bg-[#141422] border border-[#1e1e2f] w-[350px]">
        <h2 className="text-xl font-semibold text-[#ccc] mb-4">Delete Story</h2>
        <p className="text-gray-400 mb-6">
          Are you sure you want to delete "
          <span className="text-[#fff]">{storyTitle}</span>"?
        </p>
        <div className="flex justify-between">
          <button
            className="px-4 py-2 rounded hover:bg-red-600 text-[#ccc] border border-red-500 transition-all duration-200"
            onClick={onConfirm}
          >
            Yes
          </button>
          <button
            className="px-4 py-2 rounded hover:bg-gray-700 text-[#ccc] border border-gray-500 transition-all duration-200"
            onClick={onCancel}
          >
            No
          </button>
        </div>
      </div>
    </div>
  );
}
