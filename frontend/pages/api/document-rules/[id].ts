import { NextApiRequest, NextApiResponse } from 'next';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'Invalid rule ID' });
  }

  try {
    let response;
    
    switch (method) {
      case 'GET':
        // Get rule by ID
        response = await fetch(`${BACKEND_URL}/document-rules/${id}`);
        break;
        
      case 'PUT':
        // Update rule
        response = await fetch(`${BACKEND_URL}/document-rules/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(req.body),
        });
        break;
        
      case 'DELETE':
        // Delete rule
        response = await fetch(`${BACKEND_URL}/document-rules/${id}`, {
          method: 'DELETE',
        });
        break;
        
      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
        return res.status(405).json({ message: `Method ${method} Not Allowed` });
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return res.status(response.status).json({
        message: errorData.message || `Backend error: ${response.status}`,
        ...errorData
      });
    }

    const data = await response.json();
    // Extract the data from the backend response
    if (data.success && data.data) {
      return res.status(response.status).json(data.data);
    }
    return res.status(response.status).json(data);

  } catch (error) {
    console.error('Document rule API error:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
