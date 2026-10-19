import { useTheme } from 'next-themes';
import { Toaster as Sonner } from 'sonner';
import { ALERT_DURATION } from '@/lib/sweet-alert';

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { resolvedTheme } = useTheme();
  return (
    <Sonner
      theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
      position="top-center"
      offset={16}
      gap={12}
      duration={ALERT_DURATION}
      closeButton={false}
      toastOptions={{
        unstyled: true,
        duration: ALERT_DURATION,
        classNames: {
          toast: 'p-0 border-0 bg-transparent shadow-none',
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
