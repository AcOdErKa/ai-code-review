# Code Review Tool

This project is a **Code Review Tool** built using **React**, **TypeScript**, and **Vite**. It provides a user-friendly interface for reviewing code, tracking progress, and managing review history. The backend is powered by Node.js and TypeScript.

## Features
- Real-time progress tracking during code reviews.
- Manage and view review history.
- Integration with GitHub repositories.
- Customizable rules for code reviews.

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm (v7 or higher)

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/AcOdErKa/ai-code-review.git
   ```
2. Navigate to the project directory:
   ```bash
   cd ai-code-review
   ```
3. Install dependencies for both frontend and backend:
   ```bash
   cd frontend && npm install
   cd ../backend && npm install
   ```

### Running the Application
1. Start the backend server:
   ```bash
   npm run dev
   ```
2. Start the frontend development server:
   ```bash
   cd ../frontend && npm run dev
   ```
3. Open your browser and navigate to `http://localhost:3000`.

## Creating a Webhook

Webhooks allow you to receive real-time updates from GitHub. Follow these steps to create a webhook:

1. Go to your GitHub repository.
2. Navigate to **Settings > Webhooks**.
3. Click **Add webhook**.
4. Enter the payload URL (e.g., `http://your-server-url/webhook`).
5. Choose **application/json** as the content type.
6. Select the events you want to receive (e.g., push, pull request).
7. Click **Add webhook**.

### Writing Code for Webhooks
To handle webhook events, create an endpoint in the backend:

```typescript
import express from 'express';
const router = express.Router();

router.post('/webhook', (req, res) => {
  const event = req.headers['x-github-event'];
  const payload = req.body;

  switch (event) {
    case 'push':
      console.log('Push event received:', payload);
      break;
    case 'pull_request':
      console.log('Pull request event received:', payload);
      break;
    default:
      console.log('Unhandled event:', event);
  }

  res.status(200).send('Webhook received');
});

export default router;
```

## Deploying to AWS Bedrock

AWS Bedrock allows you to integrate generative AI models into your application. Follow these steps to deploy this project to AWS Bedrock:

### Setting Up Bedrock Agents
1. Log in to the AWS Management Console.
2. Navigate to **Bedrock** and create a new agent.
3. Configure the agent with the required permissions and settings.
4. Deploy the agent to your desired region.

### Switching Models
To switch models in AWS Bedrock, use the API mode:

1. Update the model configuration in your application:
   ```typescript
   const bedrockClient = new BedrockClient({ region: 'us-east-1' });
   const modelConfig = {
     modelId: 'your-model-id',
     endpoint: 'https://bedrock-endpoint.amazonaws.com',
   };
   ```
2. Use the Bedrock SDK to interact with the model:
   ```typescript
   const response = await bedrockClient.invokeModel({
     modelId: modelConfig.modelId,
     input: { text: 'Your input text' },
   });
   console.log('Model response:', response);
   ```

### Deploying the Application
1. Build the frontend:
   ```bash
   cd frontend && npm run build
   ```
2. Deploy the backend and frontend to AWS services (e.g., EC2, S3, API Gateway).
3. Update the webhook URL in GitHub to point to the deployed backend.

## Contributing
Contributions are welcome! Please fork the repository and submit a pull request.

## License
This project is licensed under the MIT License.
