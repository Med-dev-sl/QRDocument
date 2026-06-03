import { router } from 'expo-router';
import SplashScreen from '@/components/splash-screen';

export default function Index() {
  return (
    <SplashScreen onFinish={() => router.replace('/login')} />
  );
}
