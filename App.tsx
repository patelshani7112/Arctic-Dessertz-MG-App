// App.tsx
import { useEffect, useState } from 'react';
import { Text, View, Button } from 'react-native';
import { supabase } from './src/lib/supabase';

export default function App() {
  const [ready, setReady] = useState(false);
  const [emailSent, setEmailSent] = useState<string | null>(null);

  useEffect(() => {
    setReady(true);
  }, []);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
      <Text style={{ fontSize: 18, fontWeight: '600' }}>Restaurant Mobile</Text>
      <Text>API: {process.env.EXPO_PUBLIC_API_BASE || 'n/a'}</Text>

      <Button
        title="Send magic link test (edit email inside)"
        onPress={async () => {
          const testEmail = 'you@example.com'; // change to your email to test
          const { error } = await supabase.auth.signInWithOtp({ email: testEmail });
          if (error) alert(error.message);
          else setEmailSent(testEmail);
        }}
      />
      {emailSent && <Text>Sent to {emailSent}</Text>}
    </View>
  );
}
