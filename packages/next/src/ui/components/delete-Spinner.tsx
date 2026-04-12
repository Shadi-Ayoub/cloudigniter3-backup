interface SpinnerProps {
  text?: string;
  transparency?: number; // New prop for transparency degree (0 to 100)
}

const Spinner = ({ text = '', transparency = 50 }: SpinnerProps) => {
  // Ensure transparency is within 0-100 range
  const validTransparency = Math.max(0, Math.min(transparency, 100));

  // Convert transparency to Tailwind's opacity value with the passed bg color
  const opacityClass = `bg-white/${validTransparency}`;

  return (
    <div
      id='page-loader'
      className={`absolute inset-0 z-[900] flex items-center justify-center ${opacityClass} rounded backdrop-blur-sm`}
    >
      <div className='flex flex-col items-center justify-center'>
        <div className='h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent dark:border-blue-400'></div>
        {text && <div className='mt-2 text-sm text-gray-700 dark:text-gray-200'>{text}</div>}
      </div>
    </div>
  );
};

export { Spinner };
