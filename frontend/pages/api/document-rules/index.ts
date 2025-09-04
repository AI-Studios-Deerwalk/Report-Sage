import { NextApiRequest, NextApiResponse } from 'next';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  try {
    let response;
    
    switch (method) {
      case 'GET':
        // Get all rules or filtered rules
        const { university, chapter, section } = req.query;
        let url = `${BACKEND_URL}/document-rules`;
        
        if (university && chapter) {
          url = `${BACKEND_URL}/document-rules/university/${university}/chapter/${chapter}`;
        } else if (university) {
          url = `${BACKEND_URL}/document-rules/university/${university}`;
        } else if (chapter) {
          url = `${BACKEND_URL}/document-rules/chapter/${chapter}`;
        }
        
        response = await fetch(url);
        break;
        
      case 'POST':
        // Create new rule
        response = await fetch(`${BACKEND_URL}/document-rules`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(req.body),
        });
        break;
        
      default:
        res.setHeader('Allow', ['GET', 'POST']);
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
    // Extract the data array from the backend response
    if (data.success && data.data) {
      return res.status(response.status).json(data.data);
    }
    return res.status(response.status).json(data);

  } catch (error) {
    console.error('Document rules API error:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
