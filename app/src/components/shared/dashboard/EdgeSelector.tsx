import { motion } from 'motion/react';
import { Check, Layers, Copy } from 'lucide-react';
import { useEdge } from '@/context/EdgeContext';
import type { EdgeType } from '@/context/EdgeContext';

interface EdgeOption {
  type: EdgeType;
  label: string;
  description: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

const edgeOptions: EdgeOption[] = [
  {
    type: 'wrapped',
    label: 'Wrapped Edges',
    description: 'Image extends around the edges of the frame',
    icon: Layers,
  },
  {
    type: 'mirrored',
    label: 'Mirrored Edges',
    description: 'Image edges are mirrored to create seamless continuation',
    icon: Copy,
  },
];

const EdgeSelector = () => {
  const { edgeType, setEdgeType } = useEdge();

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3">
        {edgeOptions.map((option) => (
          <motion.div
            key={option.type}
            className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
              edgeType === option.type
                ? 'border-primary bg-primary/5'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => setEdgeType(option.type)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Selection indicator */}
            <motion.div
              className={`absolute top-3 right-3 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                edgeType === option.type
                  ? 'border-primary bg-primary'
                  : 'border-gray-300'
              }`}
              initial={false}
              animate={{
                scale: edgeType === option.type ? 1.1 : 1,
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{
                  scale: edgeType === option.type ? 1 : 0,
                  opacity: edgeType === option.type ? 1 : 0,
                }}
                transition={{ duration: 0.2 }}
              >
                <Check className="w-4 h-4 text-white" />
              </motion.div>
            </motion.div>

            <div className="flex items-start space-x-3">
              <motion.div
                className={`p-2 rounded-lg transition-colors duration-200 ${
                  edgeType === option.type
                    ? 'bg-primary/10 text-primary'
                    : 'bg-gray-100 text-gray-600'
                }`}
                whileHover={{
                  scale: 1.05,
                  rotate: 2,
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <option.icon className="w-5 h-5" />
              </motion.div>
              
              <div className="flex-1">
                <motion.h3
                  className={`font-semibold text-sm transition-colors duration-200 ${
                    edgeType === option.type ? 'text-primary' : 'text-gray-900'
                  }`}
                  initial={false}
                  animate={{
                    color: edgeType === option.type ? 'var(--primary)' : '#111827',
                  }}
                >
                  {option.label}
                </motion.h3>
                <p className="text-xs text-gray-500 mt-1">
                  {option.description}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Preview section */}
      <motion.div
        className="mt-6 p-4 bg-gray-50 rounded-lg"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.3 }}
      >
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Preview</h4>
        <div className="text-xs text-gray-600">
          {edgeType === 'wrapped' 
            ? 'Your image will extend around the frame edges, creating a gallery-wrapped effect with no visible borders.'
            : 'The edges of your image will be mirrored to create a seamless continuation, eliminating any white borders.'
          }
        </div>
      </motion.div>
    </div>
  );
};

export default EdgeSelector;