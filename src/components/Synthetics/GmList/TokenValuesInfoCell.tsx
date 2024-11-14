export function TokenValuesInfoCell({ token, usd }: { token?: string; usd?: string }) {
  return (
    <>
      {token && <div className="whitespace-nowrap">{token}</div>}
      {usd && <div className="whitespace-nowrap text-12 opacity-70">({usd})</div>}
    </>
  );
}
