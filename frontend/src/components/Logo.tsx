import logoSrc from '@/assets/logo.svg';

export function Logo({ className }: { className?: string }) {
  return (
    <img 
      src={logoSrc} 
      alt="Itera LifeLab" 
      className={`object-contain ${className || ''}`} 
    />
  );
}
