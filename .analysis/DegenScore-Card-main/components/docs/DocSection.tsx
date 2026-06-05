import { motion } from 'framer-motion';

interface DocSectionProps {
  id: string;
  title: string;
  icon: string;
  children: React.ReactNode;
}

export function DocSection({ id, title, icon, children }: DocSectionProps) {
  return (
    <motion.section
      id={id}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="scroll-mt-24"
    >
      <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
        <span className="text-4xl">{icon}</span>
        {title}
      </h2>
      <div className="text-gray-300">{children}</div>
    </motion.section>
  );
}
