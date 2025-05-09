import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react';

export default function TestPage() {
  const [serverStatus, setServerStatus] = React.useState<'loading' | 'connected' | 'error'>('loading');
  const [statusMessage, setStatusMessage] = React.useState('Checking server status...');

  React.useEffect(() => {
    async function checkServerStatus() {
      try {
        const response = await fetch('/api/health');
        if (response.ok) {
          const data = await response.json();
          setServerStatus('connected');
          setStatusMessage(`Server is running, ID: ${data.id || 'unknown'}`);
        } else {
          setServerStatus('error');
          setStatusMessage(`Server error: ${response.statusText}`);
        }
      } catch (error) {
        setServerStatus('error');
        setStatusMessage(`Connection error: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    checkServerStatus();
  }, []);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Server Test Page</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Server Connection Status</CardTitle>
          <CardDescription>
            This page tests connectivity to the backend server
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant={serverStatus === 'connected' ? 'default' : 'destructive'}>
            <InfoIcon className="h-4 w-4" />
            <AlertTitle>
              {serverStatus === 'loading' 
                ? 'Checking Connection...' 
                : serverStatus === 'connected' 
                  ? 'Connected' 
                  : 'Connection Error'}
            </AlertTitle>
            <AlertDescription>{statusMessage}</AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={() => {
              setServerStatus('loading');
              setStatusMessage('Checking server status...');
              fetch('/api/health')
                .then(response => {
                  if (response.ok) return response.json();
                  throw new Error(response.statusText);
                })
                .then(data => {
                  setServerStatus('connected');
                  setStatusMessage(`Server is running, ID: ${data.id || 'unknown'}`);
                })
                .catch(error => {
                  setServerStatus('error');
                  setStatusMessage(`Error: ${error.message}`);
                });
            }}
          >
            Refresh Status
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}