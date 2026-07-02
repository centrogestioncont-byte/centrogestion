export async function onRequestPost(context) {
  const { request, env } = context;

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  try {
    const apiKey = env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API key not configured' }), {
                                                status: 500,
                                                headers: corsHeaders,
                                              });
    }

    const body = await request.json();

    const response = await fetch('https://api.anthropic.com/v1/messages', {
                                        method: 'POST',
                                        headers: {
                                          'Content-Type': 'application/json',
                                          'x-api-key': apiKey,
                                          'anthropic-version': '2023-06-01',
                                        },
                                        body: JSON.stringify(body),
                                      });

    const data = await response.json();

    return new Response(JSON.stringify(data), {
                                            status: response.status,
                                            headers: corsHeaders,
                                          });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
                                            status: 500,
                                            headers: corsHeaders,
                                          });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
                              status: 204,
                              headers: {
                                'Access-Control-Allow-Origin': '*',
                                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                                'Access-Control-Allow-Headers': 'Content-Type',
                              },
                            });
}
