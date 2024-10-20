'use server'

// add https://zenn.dev/neriko/articles/2e0cde5f93ea95

const checkIsWebPushSupported = async () => {
  // グローバル空間にNotificationがあればNotification APIに対応しているとみなす
  if (!('Notification' in window)) {
    return false;
  }
  // グローバル変数navigatorにserviceWorkerプロパティがあればサービスワーカーに対応しているとみなす
  if (!('serviceWorker' in navigator)) {
    return false;
  }
  try {
    const sw = await navigator.serviceWorker.ready;
    // 利用可能になったサービスワーカーがpushManagerプロパティがあればPush APIに対応しているとみなす
    if (!('pushManager' in sw)) {
      return false;
    }
    return true;
  } catch (error) {
    return false;
  }
}
const getVapidPublicKey = async () => {
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
};

// iOS 16.4のPWAでNotification.requestPermission()を呼ぶ場合、
// ユーザーのアクション（クリックなど）から呼ばれた関数内でないと失敗します。
// ですので、このsubscribe関数はクリックやボタン押下を起因に発火するようにしてください。
export async function subscribe() {
  if (!(await checkIsWebPushSupported())) {
    throw new Error('ご利用のブラウザではWeb Pushは使えません');
  }
  const validPublicKey = await getVapidPublicKey();

  // Notification APIを使って、利用者から通知の許可を得ます。「通知を有効化しますか？」のような確認ダイアログが出ます。
  // なお、メインスレッドで許可を得ておけばServiceWorkerでも使えるようになります（当たり前ですが）。
  if (window.Notification.permission === "default") {
    const result = await window.Notification.requestPermission();
    if (result === "default") {
      throw new Error(
        "プッシュ通知の有効化がキャンセルされました。はじめからやり直してください。"
      );
    }
  }
  if (window.Notification.permission === "denied") {
    throw new Error(
      "プッシュ通知がブロックされています。ブラウザの設定から通知のブロックを解除してください。"
    );
  }

  // ブラウザのPush APIを利用し、バックエンドからもらったVAPID認証用の公開鍵を用いてプッシュ通知の購読を作成する。
  // なお、サービスワーカーは次のセクションで追加しますので、現時点ではまだ動きません。
  const currentLocalSubscription = await navigator.serviceWorker.ready.then(
    (worker) =>
      worker.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: validPublicKey,
      })
  );

  // currentLocalSubscriptionの中身は下記MDNのページを参照してください。
  // https://developer.mozilla.org/ja/docs/Web/API/PushSubscription
  // JSONシリアライズできるオブジェクトになっていた方が取り回しやすいので、toJSON()します。
  // endpoint, keysなどが空だった場合は対応外なクライアントと見做し弾きます。
  const subscriptionJSON = currentLocalSubscription.toJSON();
  if (subscriptionJSON.endpoint == null || subscriptionJSON.keys == null) {
    throw new Error(
      "ご利用のブラウザが発行したトークンは未対応のため、プッシュ通知はご利用いただけません。"
    );
  }

  try {
    // /api/webpush/subscriptionエンドポイントの実装は本記事では行いません。
    // 要するにendpoint, expiration_time, keys.p256dh, keys.authを
    // それぞれ受け取ってログインユーザーと紐づけて保存しておけばよいだけです。
    //
    // そして現実の実装では、購読作成のほかに、クライアントが現在持っている購読がバックエンドから見ても有効なのかどうかを確かめる際に
    // endpointをキーにしたGETリクエストで購読が存在するか確認する処理が必要になるはずです。
    const res = await fetch("/api/webpush/subscription", {
      method: "post",
      body: JSON.stringify({
        endpoint: subscriptionJSON.endpoint,
        expiration_time: subscriptionJSON.expirationTime ?? null,
        keys: {
          p256dh: subscriptionJSON.keys.p256dh,
          auth: subscriptionJSON.keys.auth,
        },
      }),
    });
    if (!res.ok) {
      throw new Error("購読失敗");
    }
    alert('プッシュ通知を購読しました')
  } catch (err) {
    alert("プッシュ通知の購読に失敗しました");
  }
};