import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div role="alert" className="py-8 text-center">
      <p className="font-semibold">찾을 수 없는 페이지입니다.</p>
      <Link to="/" className="mt-3 inline-flex min-h-11 items-center underline">
        처음으로
      </Link>
    </div>
  );
}
