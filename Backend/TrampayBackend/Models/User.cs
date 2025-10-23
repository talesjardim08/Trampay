public class User
{
    public ulong Id { get; set; }
    public string AccountType { get; set; }
    public string DocumentType { get; set; }
    public string DocumentNumber { get; set; }
    public string LegalName { get; set; }
    public string DisplayName { get; set; }
    public DateTime? BirthDate { get; set; }
    public string Email { get; set; }
    public string Phone { get; set; }
    public string PasswordHash { get; set; }
    public bool IsActive { get; set; }
    public bool IsVerified { get; set; }
    public DateTime CreatedAt { get; set; }
}
