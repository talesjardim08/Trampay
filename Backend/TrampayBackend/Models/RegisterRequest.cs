namespace TrampayBackend.Models
{
    public class RegisterRequest
    {
        public string? AccountType { get; set; }
        public string? DocumentType { get; set; }
        public string? DocumentNumber { get; set; }
        public string? LegalName { get; set; }
        public string? DisplayName { get; set; }
        public string? Email { get; set; }
        public string? Phone { get; set; }
        public string? AddressCity { get; set; }
        public string? AddressState { get; set; }
        public string? Password { get; set; }
    }
}
