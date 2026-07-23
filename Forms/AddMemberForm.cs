using System;
using System.Data;
using System.Data.SQLite;
using System.Linq;
using System.Windows.Forms;
using MFC_Youth_Database.Database;

namespace MFC_Youth_Database.Forms
{
    public partial class AddMemberForm : Form
    {
        public AddMemberForm()
        {
            InitializeComponent();

            LoadStatus();
            LoadChapters();
        }

        private void LoadStatus()
        {
            cmbStatus.Items.Clear();

            cmbStatus.Items.Add("Active");
            cmbStatus.Items.Add("Inactive");

            cmbStatus.SelectedIndex = 0;
        }

        private void LoadChapters()
        {
            try
            {
                using (SQLiteConnection conn = DatabaseManager.GetConnection())
                {
                    conn.Open();

                    string query = "SELECT ChapterID, ChapterName FROM Chapter ORDER BY ChapterName;";

                    SQLiteDataAdapter adapter =
                        new SQLiteDataAdapter(query, conn);

                    DataTable dt = new DataTable();

                    adapter.Fill(dt);

                    cmbChapter.DataSource = dt;
                    cmbChapter.DisplayMember = "ChapterName";
                    cmbChapter.ValueMember = "ChapterID";
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show(
                    ex.Message,
                    "Database Error",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error);
            }
        }

        private bool ValidateInputs()
        {
            if (string.IsNullOrWhiteSpace(txtLastName.Text))
            {
                MessageBox.Show("Last Name is required.", "Validation",
                    MessageBoxButtons.OK, MessageBoxIcon.Warning);

                txtLastName.Focus();
                return false;
            }

            if (string.IsNullOrWhiteSpace(txtFirstName.Text))
            {
                MessageBox.Show("First Name is required.", "Validation",
                    MessageBoxButtons.OK, MessageBoxIcon.Warning);

                txtFirstName.Focus();
                return false;
            }

            if (string.IsNullOrWhiteSpace(txtContactNumber.Text))
            {
                MessageBox.Show("Contact Number is required.", "Validation",
                    MessageBoxButtons.OK, MessageBoxIcon.Warning);

                txtContactNumber.Focus();
                return false;
            }

            if (txtContactNumber.Text.Length != 11 || !txtContactNumber.Text.All(char.IsDigit))
            {
                MessageBox.Show(
                    "Contact Number must contain exactly 11 digits.",
                    "Validation",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Warning);

                txtContactNumber.Focus();
                return false;
            }

            if (string.IsNullOrWhiteSpace(txtAddress.Text))
            {
                MessageBox.Show("Address is required.", "Validation",
                    MessageBoxButtons.OK, MessageBoxIcon.Warning);

                txtAddress.Focus();
                return false;
            }

            if (!string.IsNullOrWhiteSpace(txtEmailAddress.Text))
            {
                try
                {
                    var email = new System.Net.Mail.MailAddress(txtEmailAddress.Text);
                }
                catch
                {
                    MessageBox.Show(
                        "Please enter a valid Email Address.",
                        "Validation",
                        MessageBoxButtons.OK,
                        MessageBoxIcon.Warning);

                    txtEmailAddress.Focus();
                    return false;
                }
            }

            if (cmbStatus.SelectedIndex < 0)
            {
                MessageBox.Show("Please select a Status.", "Validation",
                    MessageBoxButtons.OK, MessageBoxIcon.Warning);

                cmbStatus.Focus();
                return false;
            }

            if (cmbChapter.SelectedIndex < 0)
            {
                MessageBox.Show("Please select a Chapter.", "Validation",
                    MessageBoxButtons.OK, MessageBoxIcon.Warning);

                cmbChapter.Focus();
                return false;
            }

            return true;
        }

        private void btnCancel_Click(object sender, EventArgs e)
        {
            this.Close();
        }

        private void txtContactNumber_KeyPress(object sender, KeyPressEventArgs e)
        {
            if (!char.IsControl(e.KeyChar) && !char.IsDigit(e.KeyChar))
            {
                e.Handled = true;
            }
        }

        private void btnSave_Click(object sender, EventArgs e)
        {
            btnSave.Enabled = false;

            if (!ValidateInputs())
            {
                btnSave.Enabled = true;
                return;
            }

            try
            {
                using (SQLiteConnection conn = DatabaseManager.GetConnection())
                {
                    conn.Open();

                    string query = @"
                INSERT INTO Member
                (
                    LastName,
                    FirstName,
                    MiddleName,
                    BirthDate,
                    ContactNumber,
                    Address,
                    EmailAddress,
                    Status,
                    ChapterID
                )
                VALUES
                (
                    @LastName,
                    @FirstName,
                    @MiddleName,
                    @BirthDate,
                    @ContactNumber,
                    @Address,
                    @EmailAddress,
                    @Status,
                    @ChapterID
                );";
                    SQLiteCommand cmd = new SQLiteCommand(query, conn);


                    cmd.Parameters.AddWithValue("@LastName", txtLastName.Text.Trim());
                    cmd.Parameters.AddWithValue("@FirstName", txtFirstName.Text.Trim());

                    if (string.IsNullOrWhiteSpace(txtMiddleName.Text))
                        cmd.Parameters.AddWithValue("@MiddleName", DBNull.Value);
                    else
                        cmd.Parameters.AddWithValue("@MiddleName", txtMiddleName.Text.Trim());

                    cmd.Parameters.AddWithValue("@BirthDate", dtpBirthDate.Value.Date);
                    cmd.Parameters.AddWithValue("@ContactNumber", txtContactNumber.Text.Trim());
                    cmd.Parameters.AddWithValue("@Address", txtAddress.Text.Trim());

                    if (string.IsNullOrWhiteSpace(txtEmailAddress.Text))
                    {
                        cmd.Parameters.AddWithValue("@EmailAddress", DBNull.Value);
                    }
                    else
                    {
                        cmd.Parameters.AddWithValue("@EmailAddress", txtEmailAddress.Text.Trim());
                    }

                    cmd.Parameters.AddWithValue("@Status", cmbStatus.Text);
                    cmd.Parameters.AddWithValue("@ChapterID", cmbChapter.SelectedValue);

                    int rowsAffected = cmd.ExecuteNonQuery();

                    if (rowsAffected > 0)
                    {
                        MessageBox.Show(
                            "Member added successfully.",
                            "Success",
                            MessageBoxButtons.OK,
                            MessageBoxIcon.Information);

                        DialogResult = DialogResult.OK;
                        Close();
                    }
                    else
                    {
                        MessageBox.Show(
                            "The member could not be saved.",
                            "Information",
                            MessageBoxButtons.OK,
                            MessageBoxIcon.Information);

                        btnSave.Enabled = true;
                    }

                    MessageBox.Show(
                        "Member added successfully.",
                        "Success",
                        MessageBoxButtons.OK,
                        MessageBoxIcon.Information);

                    DialogResult = DialogResult.OK;
                    Close();
                }
            }
            catch (SQLiteException ex)
            {
                if (ex.ResultCode == SQLiteErrorCode.Constraint)
                {
                    MessageBox.Show(
                        "The Contact Number or Email Address already exists.",
                        "Duplicate Record",
                        MessageBoxButtons.OK,
                        MessageBoxIcon.Warning);

                    btnSave.Enabled = true;
                }
                else
                {
                    MessageBox.Show(
                        "Unable to save the member.\n\nPlease try again.",
                        "Database Error",
                        MessageBoxButtons.OK,
                        MessageBoxIcon.Error);

                    btnSave.Enabled = true;
                }
            }
            catch (Exception)
            {
                MessageBox.Show(
                    "An unexpected error occurred.\n\nPlease try again.",
                    "Error",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error);

                btnSave.Enabled = true;
            }
        }
    }
}