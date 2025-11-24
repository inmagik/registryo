import { Suspense, useCallback } from "react"
import { ConfigureRj } from "react-rocketjump"
import { BrowserRouter, Redirect, Route, Switch } from "react-router-dom"
import Auth, { useAuthActions } from "use-eazy-auth"
import { AuthRoute, GuestRoute } from "use-eazy-auth/routes"
import { LoginCall, MeCall } from "./auth"
import Home from "./pages/Home"
import Login from "./pages/Login"
import MyProfile from "./pages/MyProfile"
import PasswordForgot from "./pages/PasswordForgot/PasswordForgot"
import PasswordReset from "./pages/PasswordReset"
import RepoDetails from "./pages/RepoDetails"
import TagDetail from "./pages/TagDetail"
import UserCreate from "./pages/UserCreate"
import UserDetail from "./pages/UserDetail"
import UsersList from "./pages/UsersList/UsersList"

function InnerAuth({ children }) {
  const { callAuthApiObservable } = useAuthActions()

  const withAuthCaller = useCallback(
    (effectFn, ...args) =>
      callAuthApiObservable((token) => effectFn(token ?? null), ...args),
    [callAuthApiObservable]
  )

  return <ConfigureRj effectCaller={withAuthCaller}>{children}</ConfigureRj>
}

function App() {
  return (
    <Suspense fallback={null}>
      <Auth
        loginCall={LoginCall}
        meCall={MeCall}
        storageNamespace="auth:docker-registry-ui"
      >
        <InnerAuth>
          <BrowserRouter>
            <Switch>
              <AuthRoute path="/" exact component={Home} />
              <AuthRoute
                path="/repositories/:repoName+/tag/:refName"
                exact
                component={TagDetail}
              />
              <AuthRoute
                path="/repositories/:repoName+"
                exact
                component={RepoDetails}
              />
              <AuthRoute
                redirectTest={(u) => !u.is_staff}
                path="/users"
                exact
                component={UsersList}
              />
              <AuthRoute
                redirectTest={(u) => !u.is_staff}
                path="/users/new"
                exact
                component={UserCreate}
              />
              <AuthRoute
                redirectTest={(u) => !u.is_staff}
                path="/users/:id"
                exact
                component={UserDetail}
              />
              <AuthRoute path="/me" exact component={MyProfile} />
              <GuestRoute path="/login" component={Login} />
              <Route path="/forgot-password" component={PasswordForgot} />
              <Route path="/password-reset/:t" component={PasswordReset} />
              <Redirect to="/" />
            </Switch>
          </BrowserRouter>
        </InnerAuth>
      </Auth>
    </Suspense>
  )
}

export default App
