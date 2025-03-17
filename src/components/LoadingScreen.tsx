import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface LoadingScreenProps {
  minimumLoadTime?: number;
}

export function LoadingScreen({ minimumLoadTime = 1000 }: LoadingScreenProps) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
    }, minimumLoadTime);

    return () => clearTimeout(timer);
  }, [minimumLoadTime]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-gray-50 dark:bg-gray-900 flex items-center justify-center z-50">
      <div className="relative w-full max-w-md p-8 flex flex-col items-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="w-24 h-24 relative">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 rounded-full border-t-4 border-blue-500 dark:border-blue-400"
            />
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 rounded-full border-r-4 border-blue-400 dark:border-blue-500 rotate-45"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">NT</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 2, repeat: Infinity }}
          className="h-1 bg-gradient-to-r from-blue-400 to-blue-600 dark:from-blue-500 dark:to-blue-400 rounded-full w-64 mb-6"
        />

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
            NestTask
          </h2>
          <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
            <motion.span
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              Loading
            </motion.span>
            <motion.div
              animate={{ y: [-2, 2, -2] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="flex space-x-1"
            >
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-1 h-1 rounded-full bg-gray-600 dark:bg-gray-400"
                />
              ))}
            </motion.div>
          </div>
        </motion.div>

        <div className="absolute inset-0 -z-10 overflow-hidden">
          <motion.div
            animate={{
              backgroundPosition: ['0% 0%', '100% 100%'],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              repeatType: 'reverse',
            }}
            className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
            style={{
              backgroundImage: 'radial-gradient(circle at center, #3b82f6 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />
        </div>
      </div>
    </div>
  );
}