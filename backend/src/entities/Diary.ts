import { 
    Entity, 
    PrimaryGeneratedColumn, 
    Column, 
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
		JoinColumn,
  } from "typeorm";

import { User } from "./User";

@Entity("diary")
export class Diary {
	@PrimaryGeneratedColumn()
	id!: number;

	@Column()
	date!: Date;

	@Column({ type: "text" })
	content!: string

	@CreateDateColumn({ name: "created_at" })
	created_at!: Date;

	@UpdateDateColumn({ name: "updated_at" })
	updated_at!: Date;

	@ManyToOne(() => User, (user) => user.diaries, {
		onDelete: "CASCADE", // Automatically deletes diaries when the related user is deleted
	})
	@JoinColumn({ name: "user_id" })
	user!: User;
}