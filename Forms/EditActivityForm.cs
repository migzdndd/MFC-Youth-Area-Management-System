using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;
using System.Data.SQLite;
using MFC_Youth_Database.Database;

namespace MFC_Youth_Database.Forms
{
    public partial class EditActivityForm : Form
    {

        private int reportId;
        public EditActivityForm(int reportId)
        {
            InitializeComponent();

            this.reportId = reportId;

            LoadChapters();
            LoadReportTypes();
            LoadReport();
        }

        private void LoadChapters()
        {
            try
            {
                using (SQLiteConnection conn = DatabaseManager.GetConnection())
                {
                    conn.Open();

                    string query = @"
                SELECT ChapterID, ChapterName
                FROM Chapter
                ORDER BY ChapterName;";

                    SQLiteDataAdapter adapter = new SQLiteDataAdapter(query, conn);
                    DataTable dt = new DataTable();
                    adapter.Fill(dt);

                    cmbChapter.DataSource = dt;
                    cmbChapter.DisplayMember = "ChapterName";
                    cmbChapter.ValueMember = "ChapterID";
                    cmbChapter.SelectedIndex = -1;
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show(
                    "Unable to load chapters.\n\n" + ex.Message,
                    "Database Error",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error);
            }
        }

        private void LoadReportTypes()
        {
            cmbReportType.Items.Clear();

            cmbReportType.Items.Add("Household");
            cmbReportType.Items.Add("Youth Camp");
            cmbReportType.Items.Add("Area Event");

            cmbReportType.SelectedIndex = -1;
        }

        private void LoadReport()
        {
            try
            {
                using (SQLiteConnection conn = DatabaseManager.GetConnection())
                {
                    conn.Open();

                    string query = @"
                SELECT *
                FROM Report
                WHERE ReportID = @ReportID;";

                    using (SQLiteCommand cmd = new SQLiteCommand(query, conn))
                    {
                        cmd.Parameters.AddWithValue("@ReportID", reportId);

                        using (SQLiteDataReader reader = cmd.ExecuteReader())
                        {
                            if (reader.Read())
                            {
                                txtTitle.Text = reader["Title"].ToString();
                                cmbChapter.SelectedValue = Convert.ToInt32(reader["ChapterID"]);
                                cmbReportType.Text = reader["ReportType"].ToString();
                                txtActivity.Text = reader["Activity"].ToString();
                                dtpReportDate.Value = Convert.ToDateTime(reader["ReportDate"]);
                                txtPreparedBy.Text = reader["PreparedBy"].ToString();
                                rtbDescription.Text = reader["Description"].ToString();
                            }
                        }
                    }
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
        private bool ValidateForm()
        {
            if (string.IsNullOrWhiteSpace(txtTitle.Text))
            {
                MessageBox.Show("Please enter a report title.",
                    "Validation",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Warning);

                txtTitle.Focus();
                return false;
            }

            if (cmbChapter.SelectedIndex == -1)
            {
                MessageBox.Show("Please select a chapter.",
                    "Validation",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Warning);

                cmbChapter.Focus();
                return false;
            }

            if (cmbReportType.SelectedIndex == -1)
            {
                MessageBox.Show("Please select a report type.",
                    "Validation",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Warning);

                cmbReportType.Focus();
                return false;
            }

            if (string.IsNullOrWhiteSpace(rtbDescription.Text))
            {
                MessageBox.Show("Please enter the report description.",
                    "Validation",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Warning);

                rtbDescription.Focus();
                return false;
            }

            return true;
        }

        private void btnSave_Click(object sender, EventArgs e)
        {
            if (!ValidateForm())
                return;

            try
            {
                using (SQLiteConnection conn = DatabaseManager.GetConnection())
                {
                    conn.Open();

                    string query = @"
                    UPDATE Report
                    SET
                        Title = @Title,
                        ChapterID = @ChapterID,
                        ReportType = @ReportType,
                        Activity = @Activity,
                        ReportDate = @ReportDate,
                        PreparedBy = @PreparedBy,
                        Description = @Description
                    WHERE ReportID = @ReportID;";

                    using (SQLiteCommand cmd = new SQLiteCommand(query, conn))
                    {
                        cmd.Parameters.AddWithValue("@Title", txtTitle.Text.Trim());
                        cmd.Parameters.AddWithValue("@ChapterID", cmbChapter.SelectedValue);
                        cmd.Parameters.AddWithValue("@ReportType", cmbReportType.Text);
                        cmd.Parameters.AddWithValue("@Activity", txtActivity.Text.Trim());
                        cmd.Parameters.AddWithValue("@ReportDate", dtpReportDate.Value.ToString("yyyy-MM-dd"));
                        cmd.Parameters.AddWithValue("@PreparedBy", txtPreparedBy.Text.Trim());
                        cmd.Parameters.AddWithValue("@Description", rtbDescription.Text.Trim());
                        cmd.Parameters.AddWithValue("@ReportID", reportId);

                        cmd.ExecuteNonQuery();
                    }
                }

                MessageBox.Show(
                    "Report saved successfully.",
                    "Success",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Information);

                DialogResult = DialogResult.OK;
                Close();
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

        private void btnCancel_Click(object sender, EventArgs e)
        {
            this.Close();
        }
    }
}
