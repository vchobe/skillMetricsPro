import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { getAccessToken } from '../api/auth';

const COMMON_ENDPOINTS = [
  { name: 'Server Status', url: '/health', method: 'GET' },
  { name: 'Java API Health', url: '/api/health', method: 'GET' },
  { name: 'Get Current User', url: '/api/user', method: 'GET' },
  { name: 'User Skills', url: '/api/skills/user', method: 'GET' },
  { name: 'All Skills', url: '/api/skills', method: 'GET' },
  { name: 'All Projects', url: '/api/projects', method: 'GET' },
  { name: 'Search Skills', url: '/api/search/skills?query=java', method: 'GET' }
];

const ApiTester: React.FC = () => {
  const { toast } = useToast();
  const [endpoint, setEndpoint] = useState<string>('/api/user');
  const [method, setMethod] = useState<string>('GET');
  const [requestBody, setRequestBody] = useState<string>('');
  const [response, setResponse] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [backendUrl, setBackendUrl] = useState<string>('http://localhost:8080');

  const testEndpoint = async () => {
    setLoading(true);
    setResponse('');
    setStatus('');

    const fullUrl = `${backendUrl}${endpoint}`;
    console.log(`Fetching data from: ${fullUrl}`);

    try {
      // Check if we're running a local test
      const isLocalTest = backendUrl.includes('localhost');
      
      // Get auth token if available
      const token = getAccessToken();
      console.log('Auth token available:', !!token);
      
      // Debug request info
      const debugInfo = {
        url: fullUrl,
        method,
        withAuth: !!token,
        requestBody: method !== 'GET' ? requestBody : null
      };
      console.log('Request debug info:', debugInfo);
      
      // Set up request options
      const options: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        // Add CORS mode for local testing
        ...(isLocalTest ? { 
          mode: 'cors',
          credentials: 'include'
        } : {})
      };

      if (method !== 'GET' && method !== 'HEAD' && requestBody) {
        options.body = requestBody;
      }

      // Make the request
      console.log('Sending request with options:', options);
      const res = await fetch(fullUrl, options);
      console.log('Received response:', res);
      
      const statusText = `${res.status} ${res.statusText}`;
      setStatus(statusText);

      // Try to parse as JSON first
      try {
        const data = await res.json();
        console.log('Response data:', data);
        setResponse(JSON.stringify(data, null, 2));
      } catch (e) {
        // If not JSON, get as text
        console.log('Response is not JSON, trying text:', e);
        const text = await res.text();
        setResponse(text || 'No response data');
      }

      if (res.ok) {
        toast({
          title: 'Request Successful',
          description: `${method} ${endpoint} - ${statusText}`,
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Request Failed',
          description: `${method} ${endpoint} - ${statusText}`,
        });
      }
    } catch (error) {
      console.error('Error testing endpoint:', error);
      
      // Provide more detailed error information
      const errorInfo = {
        message: error instanceof Error ? error.message : 'Unknown error',
        type: error instanceof Error ? error.constructor.name : typeof error,
        stack: error instanceof Error ? error.stack : null
      };
      
      console.log('Detailed error info:', errorInfo);
      
      setStatus('Error connecting to server');
      setResponse(JSON.stringify(errorInfo, null, 2));
      
      toast({
        variant: 'destructive',
        title: 'Connection Error',
        description: error instanceof Error ? 
          `${error.constructor.name}: ${error.message}` : 
          'Could not connect to the Java backend server',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Tabs defaultValue="tester">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="tester">API Tester</TabsTrigger>
          <TabsTrigger value="common">Common Endpoints</TabsTrigger>
        </TabsList>
        
        <TabsContent value="tester">
          <Card>
            <CardHeader>
              <CardTitle>API Test Tool</CardTitle>
              <CardDescription>Test backend API endpoints</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-full">
                  <label className="block text-sm font-medium mb-1">Backend URL</label>
                  <Input
                    value={backendUrl}
                    onChange={(e) => setBackendUrl(e.target.value)}
                    placeholder="http://localhost:8080"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3/4">
                  <label className="block text-sm font-medium mb-1">API Endpoint</label>
                  <Input
                    value={endpoint}
                    onChange={(e) => setEndpoint(e.target.value)}
                    placeholder="/api/user"
                  />
                </div>
                <div className="w-1/4">
                  <label className="block text-sm font-medium mb-1">Method</label>
                  <select
                    value={method}
                    onChange={(e) => setMethod(e.target.value)}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2"
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="DELETE">DELETE</option>
                    <option value="PATCH">PATCH</option>
                  </select>
                </div>
              </div>
              
              {(method === 'POST' || method === 'PUT' || method === 'PATCH') && (
                <div>
                  <label className="block text-sm font-medium mb-1">Request Body (JSON)</label>
                  <Textarea
                    value={requestBody}
                    onChange={(e) => setRequestBody(e.target.value)}
                    placeholder="Enter JSON data"
                    rows={5}
                  />
                </div>
              )}
              
              <div className="pt-4">
                <Button 
                  onClick={testEndpoint} 
                  disabled={loading} 
                  className="w-full"
                >
                  {loading ? 'Sending Request...' : 'Send Request'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="common">
          <Card>
            <CardHeader>
              <CardTitle>Common API Endpoints</CardTitle>
              <CardDescription>Frequently used API endpoints</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {COMMON_ENDPOINTS.map((ep, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    onClick={() => {
                      setEndpoint(ep.url);
                      setMethod(ep.method);
                      setRequestBody('');
                    }}
                    className="justify-start"
                  >
                    <span className="mr-2 px-2 py-0.5 bg-gray-100 rounded text-gray-800 text-xs">
                      {ep.method}
                    </span>
                    {ep.name}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {status && (
        <div className="mt-6">
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-lg flex items-center justify-between">
                <span>Response</span>
                <span className={`px-2 py-1 text-xs rounded ${status.startsWith('2') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {status}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-50 p-4 rounded-md overflow-auto max-h-96 text-sm">
                {response || 'No response data'}
              </pre>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ApiTester;