<h1 align="center">Source code for RESTful API that provides OAuth2 Discord endpoints for authentication and authorization, as well as endpoints for delivering content for my website.</h1>

## Features

- OAuth2 Discord Endpoints:
  - `/v1/oauth2/`: Endpoint for user authentication using Discord OAuth2.
  - `/v1/oauth2/discord`: Currently not used. For dev. purposes.
  - `/v1/oauth2/renew`: Endpoint to renew data and access tokens.

- Content Delivery Endpoints:
  - `/data/body_style`: Endpoint to retrieve CSS style for www.favoslav.cz.
  - `/data/icon`: Endpoint to retrieve icon for www.favoslav.cz.
  - `/data/menu_script`: Endpoint to retrieve JS hamburger menu script for www.favoslav.cz.

## Getting Started

To get started with using the API, follow these steps:

1. Clone the repository: `git clone https://github.com/mrFavoslav/api.favoslav.cz.git`
2. Install dependencies: `npm install`
3. Set up environment variables: Copy the `.env.example` file to `.env` and update the variables with your own values.
4. Start the API server: `npm start`

## API Documentation

For detailed information about each endpoint and how to use them, please refer to the [API Documentation](https://www.favoslav.cz/docs/).

## Contributing

Contributions are welcome! If you have any suggestions, improvements, or bug fixes, feel free to open an issue or submit a pull request.
To contribute to this project, please follow the [standard Git workflow](https://git-scm.com/book/en/v2/Git-Basics-Getting-a-Git-Repository#The-Standard-Git-Workflow) and [CONTRIBUTING](./CONTRIBUTING.md).

1. Fork this repository
2. Create a new branch for your changes: `git checkout -b my-feature`
3. Commit your changes: `git commit -am "Add my feature"`
4. Push the branch: `git push origin my-feature`
5. Open a pull request

## License

This project is licensed under the [MIT License](LICENSE).


