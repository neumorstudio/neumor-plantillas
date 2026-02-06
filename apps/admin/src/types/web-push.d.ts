declare module "web-push" {
  interface PushSubscriptionKeys {
    p256dh: string;
    auth: string;
  }

  interface PushSubscription {
    endpoint: string;
    keys: PushSubscriptionKeys;
  }

  interface SendResult {
    statusCode: number;
    body?: string;
  }

  const webpush: {
    setVapidDetails: (subject: string, publicKey: string, privateKey: string) => void;
    sendNotification: (subscription: PushSubscription, payload?: string) => Promise<SendResult>;
    generateVAPIDKeys: () => { publicKey: string; privateKey: string };
  };

  export default webpush;
}
