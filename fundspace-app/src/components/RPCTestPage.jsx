import React, { useState } from 'react';
import { getDashboardData, getGrantsWithDetails } from '../utils/rpcClientFunctions';
import { supabase } from '../supabaseClient';

const RPCTestPage = () => {
  const [testResults, setTestResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const addResult = (test, success, data, error = null) => {
    setTestResults(prev => [...prev, {
      test,
      success,
      data,
      error,
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  const runTests = async () => {
    setLoading(true);
    setTestResults([]);
    
    console.log('Testing RPC functions...');

    try {
      console.log('1. Testing direct Supabase RPC...');
      const { data, error } = await supabase.rpc('get_dashboard_data');
      
      if (error) {
        addResult('Direct Dashboard RPC', false, null, error.message);
        console.error('Direct RPC failed:', error);
      } else {
        addResult('Direct Dashboard RPC', true, {
          posts: data?.posts?.length || 0,
          grants: data?.recent_grants?.length || 0,
          organizations: data?.trending_organizations?.length || 0
        });
        console.log('Direct RPC success:', data);
      }
    } catch (err) {
      addResult('Direct Dashboard RPC', false, null, err.message);
      console.error('Direct RPC error:', err);
    }

    try {
      console.log('2. Testing client function wrapper...');
      const data = await getDashboardData();
      
      addResult('Client Dashboard Function', true, {
        posts: data?.posts?.length || 0,
        grants: data?.recent_grants?.length || 0,
        organizations: data?.trending_organizations?.length || 0
      });
      console.log('Client function success:', data);
      
    } catch (err) {
      addResult('Client Dashboard Function', false, null, err.message);
      console.error('Client function failed:', err);
    }

    try {
      console.log('3. Testing grants RPC...');
      const data = await getGrantsWithDetails({ limit: 5 });
      
      addResult('Grants RPC', true, {
        grants: data?.grants?.length || 0,
        total_count: data?.total_count || 0
      });
      console.log('Grants RPC success:', data);
      
    } catch (err) {
      addResult('Grants RPC', false, null, err.message);
      console.error('Grants RPC failed:', err);
    }

    setLoading(false);
    console.log('RPC Tests Complete!');
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg border border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            RPC Functions Test Page
          </h1>
          <p className="text-slate-600">
            Test your deployed RPC functions to ensure they're working correctly
          </p>
        </div>

        <div className="p-6">
          <button
            onClick={runTests}
            disabled={loading}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              loading
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {loading ? 'Running Tests...' : 'Run RPC Tests'}
          </button>

          {testResults.length > 0 && (
            <div className="mt-6 space-y-4">
              <h2 className="text-lg font-semibold text-slate-900">Test Results:</h2>
              
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${
                    result.success
                      ? 'bg-green-50 border-green-200'
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">
                      {result.success ? '✅' : '❌'} {result.test}
                    </h3>
                    <span className="text-sm text-slate-500">{result.timestamp}</span>
                  </div>
                  
                  {result.success ? (
                    <pre className="text-sm text-green-700 bg-green-100 p-2 rounded overflow-x-auto">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  ) : (
                    <div className="text-sm text-red-700 bg-red-100 p-2 rounded">
                      <strong>Error:</strong> {result.error}
                    </div>
                  )}
                </div>
              ))}
              
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">What This Means:</h3>
                <div className="text-sm text-blue-800 space-y-1">
                  {testResults.every(r => r.success) ? (
                    <>
                      <p>All RPC functions are working correctly!</p>
                      <p>You can now proceed to migrate your components</p>
                      <p>Expected API reduction: 60-85%</p>
                    </>
                  ) : (
                    <>
                      <p>Some RPC functions failed - need debugging</p>
                      <p>Check the error messages above</p>
                      <p>Common fixes: redeploy functions, check permissions</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RPCTestPage;