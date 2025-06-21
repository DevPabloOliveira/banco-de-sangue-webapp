import { isAuth } from '../../app.js';

test('isAuth passa se sessão tiver userId', () => {
  const req = { session : { userId : 1 } };
  const res = {};
  const next = jest.fn();
  isAuth(req, res, next);
  expect(next).toHaveBeenCalled();
});

test('isAuth bloqueia sem sessão', () => {
  const redirect = jest.fn();
  const res = { status: () => ({ redirect }) };
  isAuth({ session : {} }, res);
  expect(redirect).toHaveBeenCalledWith('/');
});
