# Page snapshot

```yaml
- generic [ref=e2]:
  - region "Notifications alt+T"
  - generic [ref=e4]:
    - generic [ref=e5]:
      - generic [ref=e6]:
        - img "AzVirt 35 years logo" [ref=e7]
        - generic [ref=e8]: AzVirt DMS
      - generic [ref=e9]: Welcome back
      - generic [ref=e10]: Enter your credentials to access your dashboard
    - generic [ref=e12]:
      - generic [ref=e13]:
        - generic [ref=e14]: Username
        - textbox "Username" [ref=e15]:
          - /placeholder: Enter your username
          - text: wronguser
      - generic [ref=e16]:
        - generic [ref=e17]: Password
        - textbox "Password" [active] [ref=e18]:
          - /placeholder: ••••••••
          - text: wrongpass
      - button "Sign In" [ref=e19] [cursor=pointer]
    - generic [ref=e20]:
      - button "Sign In with Auth0" [ref=e21] [cursor=pointer]
      - generic [ref=e22]:
        - text: New to AzVirt?
        - link "Create an account" [ref=e23] [cursor=pointer]:
          - /url: /register
```